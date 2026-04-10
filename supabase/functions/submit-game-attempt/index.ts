import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paperclip-run-id",
};

type AttemptBody = {
  childId: string;
  gameId: string;
  /** Idempotent session key per child (omit for always-new session). */
  clientSessionId?: string;
  levelId?: string | null;
  startedAt?: string;
  attempt: {
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

  const { childId, gameId, clientSessionId, levelId, startedAt, attempt } = body;
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

  const payload =
    attempt.payload && typeof attempt.payload === "object"
      ? attempt.payload
      : {};

  const att = await supabase
    .from("game_attempts")
    .insert({
      session_id: sessionId,
      child_id: childId,
      game_id: gameId,
      level_id: levelId && levelId !== "" ? levelId : null,
      attempt_index: attemptIndex,
      score,
      stars,
      duration_ms: durationMs,
      payload,
    })
    .select("id, created_at")
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
  });
});
