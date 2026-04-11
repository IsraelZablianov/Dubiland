import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paperclip-run-id",
};

const AGE_BANDS = new Set(["3-4", "4-5", "5-6", "6-7"]);
const METRIC_DOMAINS = new Set(["math", "letters", "reading"]);
const TREND_LABELS = new Set(["improving", "steady", "needs_support"]);
const PROGRESSION_BANDS = new Set(["1-3", "1-5", "1-10"]);
const MASTERY_OUTCOMES = new Set([
  "unknown",
  "introduced",
  "practicing",
  "passed",
  "mastered",
  "needs_support",
]);
/** Keep payloads small so rollups / dashboard queries stay predictable (JSONB bloat). */
const MAX_ATTEMPT_PAYLOAD_CHARS = 14_000;

type AttemptBody = {
  childId: string;
  gameId: string;
  /** Idempotent session key per child (omit for always-new session). */
  clientSessionId?: string;
  /**
   * Optional wall-clock end for this session touch (ISO-8601). When omitted, server uses now().
   * `ended_at` is set to GREATEST(previous, clamped candidate) for idempotent retries.
   */
  sessionEndedAt?: string | null;
  levelId?: string | null;
  /** Level the child started from for this progression context (must belong to gameId). */
  startingLevelId?: string | null;
  startedAt?: string;
  /** Resolved published profile (must match gameId); optional for legacy clients. */
  difficultyProfileId?: string | null;
  /** Child age band label for analytics; duplicated in age_band column when valid. */
  ageBand?: string | null;
  /** Coarse mastery signal (stored on game_attempts.mastery_outcome). */
  masteryOutcome?: string | null;
  /** Attempt was taken in scaffolding / reduced-demand mode. */
  inSupportMode?: boolean;
  /** Structured support hints (counts, flags); merged into support_flags JSONB. */
  supportFlags?: Record<string, unknown>;
  attempt: {
    /**
     * Client-generated UUID for this logical attempt: upsert on game_attempts.id
     * so retries / offline replay do not duplicate rows or inflate rollups.
     */
    attemptId?: string;
    attemptIndex?: number;
    score?: number;
    stars?: number;
    durationMs?: number | null;
    payload?: Record<string, unknown>;
  };
};

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function roundMetric(n: number, places: number): number {
  const p = 10 ** places;
  return Math.round(n * p) / p;
}

type MetricDomain = "math" | "letters" | "reading";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateAndNormalizeParentMetricsV1(
  raw: Record<string, unknown>,
): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  if (raw.contractVersion !== "parent-metrics.v1") {
    return {
      ok: false,
      message: "parentMetricsV1.contractVersion must be parent-metrics.v1",
    };
  }
  const domain = raw.domain;
  if (typeof domain !== "string" || !METRIC_DOMAINS.has(domain)) {
    return { ok: false, message: "parentMetricsV1.domain must be math, letters, or reading" };
  }
  const skillKey =
    typeof raw.skillKey === "string" ? raw.skillKey.trim() : "";
  if (skillKey.length < 1 || skillKey.length > 96) {
    return {
      ok: false,
      message: "parentMetricsV1.skillKey must be a non-empty string (max 96 chars)",
    };
  }

  const accRaw = raw.accuracyPct;
  const acc = typeof accRaw === "number" ? accRaw : Number(accRaw);
  if (!Number.isFinite(acc)) {
    return { ok: false, message: "parentMetricsV1.accuracyPct must be a number" };
  }
  if (acc < 0 || acc > 100) {
    return { ok: false, message: "parentMetricsV1.accuracyPct must be between 0 and 100" };
  }

  const hintTrend = raw.hintTrend;
  if (typeof hintTrend !== "string" || !TREND_LABELS.has(hintTrend)) {
    return {
      ok: false,
      message: "parentMetricsV1.hintTrend must be improving, steady, or needs_support",
    };
  }
  const independenceTrend = raw.independenceTrend;
  if (typeof independenceTrend !== "string" || !TREND_LABELS.has(independenceTrend)) {
    return {
      ok: false,
      message:
        "parentMetricsV1.independenceTrend must be improving, steady, or needs_support",
    };
  }
  const progressionBand = raw.progressionBand;
  if (typeof progressionBand !== "string" || !PROGRESSION_BANDS.has(progressionBand)) {
    return {
      ok: false,
      message: "parentMetricsV1.progressionBand must be 1-3, 1-5, or 1-10",
    };
  }

  const out: Record<string, unknown> = {
    contractVersion: "parent-metrics.v1",
    domain,
    skillKey,
    accuracyPct: roundMetric(clampPct(acc), 2),
    hintTrend,
    independenceTrend,
    progressionBand,
  };

  if (raw.ageBand !== undefined && raw.ageBand !== null) {
    if (typeof raw.ageBand !== "string" || !AGE_BANDS.has(raw.ageBand)) {
      return { ok: false, message: "parentMetricsV1.ageBand invalid when provided" };
    }
    out.ageBand = raw.ageBand;
  }
  if (raw.gatePassed !== undefined && raw.gatePassed !== null) {
    if (typeof raw.gatePassed !== "boolean") {
      return { ok: false, message: "parentMetricsV1.gatePassed must be a boolean when provided" };
    }
    out.gatePassed = raw.gatePassed;
  }

  const optPct = (
    key: string,
    outKey: string,
  ): { ok: false; message: string } | undefined => {
    const v = raw[key];
    if (v === undefined || v === null) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return {
        ok: false,
        message: `parentMetricsV1.${key} must be a number between 0 and 100 when provided`,
      };
    }
    out[outKey] = roundMetric(clampPct(n), 2);
    return undefined;
  };

  const e1 = optPct("decodeAccuracyPct", "decodeAccuracyPct");
  if (e1) return e1;
  const e2 = optPct("sequenceEvidenceScore", "sequenceEvidenceScore");
  if (e2) return e2;
  const e3 = optPct("listenParticipationPct", "listenParticipationPct");
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
  const rate = typeof rateRaw === "number" ? rateRaw : Number(rateRaw);
  if (!Number.isFinite(rate)) return null;

  const htRaw = summary.hintTrend;
  const hintTrend =
    typeof htRaw === "string" && TREND_LABELS.has(htRaw) ? htRaw : "steady";

  const bandRaw = summary.highestStableRange;
  const progressionBand =
    typeof bandRaw === "string" && PROGRESSION_BANDS.has(bandRaw) ? bandRaw : "1-5";

  const independenceTrend = hintTrend;

  const out: Record<string, unknown> = {
    contractVersion: "parent-metrics.v1",
    domain,
    skillKey,
    accuracyPct: roundMetric(clampPct(rate), 2),
    hintTrend,
    independenceTrend,
    progressionBand,
  };

  const age = summary.ageBand;
  if (typeof age === "string" && AGE_BANDS.has(age)) {
    out.ageBand = age;
  }
  if (typeof summary.gatePassed === "boolean") {
    out.gatePassed = summary.gatePassed;
  }

  const decRaw = summary.decodeAccuracy;
  const dec = typeof decRaw === "number" ? decRaw : Number(decRaw);
  if (Number.isFinite(dec)) {
    out.decodeAccuracyPct = roundMetric(clampPct(dec), 2);
  }
  const seqRaw = summary.sequenceEvidenceScore;
  const seq = typeof seqRaw === "number" ? seqRaw : Number(seqRaw);
  if (Number.isFinite(seq)) {
    out.sequenceEvidenceScore = roundMetric(clampPct(seq), 2);
  }
  const listenRaw = summary.listenParticipation;
  const listen = typeof listenRaw === "number" ? listenRaw : Number(listenRaw);
  if (Number.isFinite(listen)) {
    out.listenParticipationPct = roundMetric(clampPct(listen), 2);
  }

  return out;
}

async function resolveCurriculumDomainAndSkill(
  supabase: ReturnType<typeof createClient>,
  gameId: string,
): Promise<
  { ok: true; domain: MetricDomain; skillKey: string } | { ok: false; message: string }
> {
  const gr = await supabase
    .from("games")
    .select("slug, curriculum_domain")
    .eq("id", gameId)
    .maybeSingle();
  if (gr.error) return { ok: false, message: gr.error.message };
  const domain = gr.data?.curriculum_domain;
  const slug = gr.data?.slug;
  if (!slug || !domain) {
    return {
      ok: false,
      message: "game not found, not visible, or has no parent-metrics curriculum domain",
    };
  }
  if (domain !== "math" && domain !== "letters" && domain !== "reading") {
    return { ok: false, message: "game topic is not a curriculum domain" };
  }
  return {
    ok: true,
    domain,
    skillKey: slug,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing or invalid Authorization" }, 401);
  }

  let body: AttemptBody;
  try {
    body = (await req.json()) as AttemptBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const {
    childId,
    gameId,
    clientSessionId,
    sessionEndedAt,
    levelId,
    startingLevelId,
    startedAt,
    difficultyProfileId,
    ageBand,
    masteryOutcome,
    inSupportMode,
    supportFlags,
    attempt,
  } = body;
  if (!childId || !gameId || !attempt || typeof attempt !== "object") {
    return jsonResponse(
      { error: "childId, gameId, and attempt are required" },
      400,
    );
  }
  if (!isUuid(childId) || !isUuid(gameId)) {
    return jsonResponse({ error: "childId and gameId must be UUIDs" }, 400);
  }
  if (levelId != null && levelId !== "" && !isUuid(levelId)) {
    return jsonResponse({ error: "levelId must be a UUID when provided" }, 400);
  }
  if (
    difficultyProfileId != null &&
    difficultyProfileId !== "" &&
    !isUuid(difficultyProfileId)
  ) {
    return jsonResponse(
      { error: "difficultyProfileId must be a UUID when provided" },
      400,
    );
  }
  if (ageBand != null && ageBand !== "" && !AGE_BANDS.has(ageBand)) {
    return jsonResponse(
      { error: "ageBand must be one of 3-4, 4-5, 5-6, 6-7 when provided" },
      400,
    );
  }
  if (
    startingLevelId != null &&
    startingLevelId !== "" &&
    !isUuid(startingLevelId)
  ) {
    return jsonResponse(
      { error: "startingLevelId must be a UUID when provided" },
      400,
    );
  }
  if (sessionEndedAt != null && sessionEndedAt.trim() !== "") {
    const parsedEnd = Date.parse(sessionEndedAt);
    if (!Number.isFinite(parsedEnd)) {
      return jsonResponse(
        { error: "sessionEndedAt must be a valid ISO-8601 timestamp when provided" },
        400,
      );
    }
  }
  const trimmedMastery =
    masteryOutcome && masteryOutcome.trim() !== ""
      ? masteryOutcome.trim()
      : null;
  if (trimmedMastery && !MASTERY_OUTCOMES.has(trimmedMastery)) {
    return jsonResponse(
      {
        error:
          "masteryOutcome must be one of unknown, introduced, practicing, passed, mastered, needs_support when provided",
      },
      400,
    );
  }
  const attemptIdRaw = attempt.attemptId?.trim();
  const attemptId =
    attemptIdRaw && attemptIdRaw !== "" ? attemptIdRaw : undefined;
  if (attemptId != null && !isUuid(attemptId)) {
    return jsonResponse(
      { error: "attempt.attemptId must be a UUID when provided" },
      400,
    );
  }

  const score = Number(attempt.score ?? 0);
  const stars = Number(attempt.stars ?? 0);
  const attemptIndex = Number(attempt.attemptIndex ?? 0);
  const durationMs =
    attempt.durationMs == null ? null : Number(attempt.durationMs);
  if (!Number.isFinite(score) || !Number.isFinite(stars) || !Number.isFinite(attemptIndex)) {
    return jsonResponse({ error: "attempt numeric fields invalid" }, 400);
  }
  if (stars < 0 || stars > 3) {
    return jsonResponse({ error: "stars must be 0–3" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401);
  }

  let resolvedDifficultyProfileId: string | null = null;
  const trimmedProfileId =
    difficultyProfileId && difficultyProfileId.trim() !== ""
      ? difficultyProfileId.trim()
      : null;
  if (trimmedProfileId) {
    const prof = await supabase
      .from("game_difficulty_profiles")
      .select("id, game_id")
      .eq("id", trimmedProfileId)
      .eq("game_id", gameId)
      .maybeSingle();
    if (prof.error) {
      return jsonResponse({ error: prof.error.message }, 400);
    }
    if (!prof.data?.id) {
      return jsonResponse(
        {
          error:
            "difficultyProfileId not found, unpublished, or does not match gameId",
        },
        400,
      );
    }
    resolvedDifficultyProfileId = prof.data.id;
  }

  let resolvedStartingLevelId: string | null = null;
  const trimmedStart =
    startingLevelId && startingLevelId.trim() !== ""
      ? startingLevelId.trim()
      : null;
  if (trimmedStart) {
    const lvl = await supabase
      .from("game_levels")
      .select("id, game_id")
      .eq("id", trimmedStart)
      .maybeSingle();
    if (lvl.error) {
      return jsonResponse({ error: lvl.error.message }, 400);
    }
    if (!lvl.data?.id || lvl.data.game_id !== gameId) {
      return jsonResponse(
        { error: "startingLevelId not found or does not match gameId" },
        400,
      );
    }
    resolvedStartingLevelId = lvl.data.id;
  }

  let sessionId: string;
  let sessionStartedAtMs: number;
  let sessionEndedAtPrevMs: number | null;

  if (clientSessionId && clientSessionId.trim() !== "") {
    const { data: existing, error: selErr } = await supabase
      .from("game_sessions")
      .select("id, game_id, started_at, ended_at")
      .eq("child_id", childId)
      .eq("client_session_id", clientSessionId.trim())
      .maybeSingle();

    if (selErr) {
      return jsonResponse({ error: selErr.message }, 400);
    }

    if (existing?.id) {
      if (existing.game_id !== gameId) {
        return jsonResponse(
          { error: "clientSessionId belongs to a different game" },
          409,
        );
      }
      sessionId = existing.id;
      sessionStartedAtMs = Date.parse(existing.started_at as string);
      sessionEndedAtPrevMs = existing.ended_at
        ? Date.parse(existing.ended_at as string)
        : null;
    } else {
      const ins = await supabase
        .from("game_sessions")
        .insert({
          child_id: childId,
          game_id: gameId,
          client_session_id: clientSessionId.trim(),
          started_at: startedAt ?? new Date().toISOString(),
        })
        .select("id, started_at, ended_at")
        .single();

      if (ins.error || !ins.data?.id) {
        return jsonResponse(
          { error: ins.error?.message ?? "Failed to create session" },
          400,
        );
      }
      sessionId = ins.data.id;
      sessionStartedAtMs = Date.parse(ins.data.started_at as string);
      sessionEndedAtPrevMs = ins.data.ended_at
        ? Date.parse(ins.data.ended_at as string)
        : null;
    }
  } else {
    const ins = await supabase
      .from("game_sessions")
      .insert({
        child_id: childId,
        game_id: gameId,
        started_at: startedAt ?? new Date().toISOString(),
      })
      .select("id, started_at, ended_at")
      .single();

    if (ins.error || !ins.data?.id) {
      return jsonResponse(
        { error: ins.error?.message ?? "Failed to create session" },
        400,
      );
    }
    sessionId = ins.data.id;
    sessionStartedAtMs = Date.parse(ins.data.started_at as string);
    sessionEndedAtPrevMs = ins.data.ended_at
      ? Date.parse(ins.data.ended_at as string)
      : null;
  }

  if (!Number.isFinite(sessionStartedAtMs)) {
    return jsonResponse({ error: "Invalid session started_at" }, 400);
  }

  const basePayload =
    attempt.payload && typeof attempt.payload === "object"
      ? { ...attempt.payload }
      : {};
  const trimmedAgeBand =
    ageBand && ageBand.trim() !== "" ? ageBand.trim() : null;
  if (trimmedAgeBand) {
    basePayload.dubilandAgeBand = trimmedAgeBand;
  }
  if (resolvedDifficultyProfileId) {
    basePayload.dubilandDifficultyProfileId = resolvedDifficultyProfileId;
  }

  const pmRaw = basePayload.parentMetricsV1;
  if (pmRaw !== undefined && pmRaw !== null) {
    if (!isRecord(pmRaw)) {
      return jsonResponse(
        { error: "parentMetricsV1 must be an object when provided" },
        400,
      );
    }
    const validated = validateAndNormalizeParentMetricsV1(pmRaw);
    if (!validated.ok) {
      return jsonResponse({ error: validated.message }, 400);
    }
    const mapRes = await resolveCurriculumDomainAndSkill(supabase, gameId);
    if (!mapRes.ok) {
      return jsonResponse({ error: mapRes.message }, 400);
    }
    const coerced = { ...validated.value, domain: mapRes.domain };
    basePayload.parentMetricsV1 = coerced;
  } else if (isRecord(basePayload.summaryMetrics)) {
    const mapRes = await resolveCurriculumDomainAndSkill(supabase, gameId);
    if (mapRes.ok) {
      const derived = deriveParentMetricsV1FromSummary({
        summary: basePayload.summaryMetrics,
        domain: mapRes.domain,
        skillKey: mapRes.skillKey,
      });
      if (derived) {
        basePayload.parentMetricsV1 = derived;
      }
    }
  }

  const payload = summarizePayloadForStorage(basePayload);

  const supportFlagsRow =
    supportFlags && typeof supportFlags === "object" && !Array.isArray(supportFlags)
      ? supportFlags
      : {};

  const attemptRow: Record<string, unknown> = {
    session_id: sessionId,
    child_id: childId,
    game_id: gameId,
    level_id: levelId && levelId !== "" ? levelId : null,
    starting_level_id: resolvedStartingLevelId,
    age_band: trimmedAgeBand,
    mastery_outcome: trimmedMastery,
    in_support_mode: Boolean(inSupportMode),
    support_flags: supportFlagsRow,
    difficulty_profile_id: resolvedDifficultyProfileId,
    attempt_index: attemptIndex,
    score,
    stars,
    duration_ms: durationMs,
    payload,
  };
  if (attemptId) {
    attemptRow.id = attemptId;
  }

  const att = attemptId
    ? await supabase
      .from("game_attempts")
      .upsert(attemptRow, { onConflict: "id" })
      .select("id, created_at, updated_at")
      .single()
    : await supabase
      .from("game_attempts")
      .insert(attemptRow)
      .select("id, created_at, updated_at")
      .single();

  if (att.error || !att.data) {
    return jsonResponse(
      { error: att.error?.message ?? "Failed to record attempt" },
      400,
    );
  }

  const nowMs = Date.now();
  const skewMs = 120_000;
  const explicitEnd =
    sessionEndedAt != null && sessionEndedAt.trim() !== ""
      ? Date.parse(sessionEndedAt.trim())
      : nowMs;
  const candidateMs = Number.isFinite(explicitEnd) ? explicitEnd : nowMs;
  const maxEndMs = nowMs + skewMs;
  let endMs = Math.min(candidateMs, maxEndMs);
  endMs = Math.max(endMs, sessionStartedAtMs);
  if (sessionEndedAtPrevMs != null && Number.isFinite(sessionEndedAtPrevMs)) {
    endMs = Math.max(endMs, sessionEndedAtPrevMs);
  }

  const endIso = new Date(endMs).toISOString();
  const sessUp = await supabase
    .from("game_sessions")
    .update({ ended_at: endIso })
    .eq("id", sessionId);

  if (sessUp.error) {
    return jsonResponse(
      { error: sessUp.error.message ?? "Failed to finalize session" },
      400,
    );
  }

  return jsonResponse({
    sessionId,
    attemptId: att.data.id,
    createdAt: att.data.created_at,
    updatedAt: att.data.updated_at,
    sessionEndedAt: endIso,
  });
});
