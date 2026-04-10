import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paperclip-run-id",
};

const AGE_BANDS = new Set(["3-4", "4-5", "5-6", "6-7"]);
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
  return meta;
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

  if (clientSessionId && clientSessionId.trim() !== "") {
    const { data: existing, error: selErr } = await supabase
      .from("game_sessions")
      .select("id, game_id")
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
    } else {
      const ins = await supabase
        .from("game_sessions")
        .insert({
          child_id: childId,
          game_id: gameId,
          client_session_id: clientSessionId.trim(),
          started_at: startedAt ?? new Date().toISOString(),
        })
        .select("id")
        .single();

      if (ins.error || !ins.data?.id) {
        return jsonResponse(
          { error: ins.error?.message ?? "Failed to create session" },
          400,
        );
      }
      sessionId = ins.data.id;
    }
  } else {
    const ins = await supabase
      .from("game_sessions")
      .insert({
        child_id: childId,
        game_id: gameId,
        started_at: startedAt ?? new Date().toISOString(),
      })
      .select("id")
      .single();

    if (ins.error || !ins.data?.id) {
      return jsonResponse(
        { error: ins.error?.message ?? "Failed to create session" },
        400,
      );
    }
    sessionId = ins.data.id;
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

  return jsonResponse({
    sessionId,
    attemptId: att.data.id,
    createdAt: att.data.created_at,
    updatedAt: att.data.updated_at,
  });
});
