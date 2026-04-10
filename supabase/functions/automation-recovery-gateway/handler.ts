import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paperclip-run-id",
};

export type RecoveryDeps = {
  supabase: SupabaseClient;
  fetch: typeof fetch;
  now: () => number;
  featureEnabled: boolean;
  gatewaySecret: string;
  watchdogAgentId: string;
  paperclipUrl: string;
  paperclipKey: string;
  targetAllowlist: Set<string>;
  rateLimitPerMinute: number;
  loopWindowSec: number;
  loopMaxPerWindow: number;
};

export type PostBody = {
  requestedByAgentId?: string;
  targetAgentId?: string;
  action?: string;
  reason?: string;
  idempotencyKey?: string;
  paperclipRunId?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
}

export function normalizeAction(raw: string): string {
  const a = raw.trim().toLowerCase().replace(/\//g, "_");
  if (a === "heartbeat_invoke") return "heartbeat_invoke";
  if (a === "resume") return "resume";
  if (a === "resume_and_invoke") return "resume_and_invoke";
  return raw.trim();
}

const ALLOWED_ACTIONS = new Set([
  "resume",
  "heartbeat_invoke",
  "resume_and_invoke",
]);

function bearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

export function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw.split(",").map((s) => s.trim()).filter((s) => isUuid(s)),
  );
}

export function loadRecoveryDeps(get: (k: string) => string | undefined): RecoveryDeps | { error: string } {
  const gatewaySecret = get("AUTOMATION_GATEWAY_SECRET")?.trim() ?? "";
  const watchdogAgentId = get("WATCHDOG_AGENT_ID")?.trim() ?? "";
  const paperclipUrl = (get("PAPERCLIP_API_URL") ?? "").replace(/\/$/, "");
  const paperclipKey = get("PAPERCLIP_AUTOMATION_API_KEY")?.trim() ?? "";
  const enabledRaw = (get("RECOVERY_GATEWAY_ENABLED") ?? "true").toLowerCase();
  const featureEnabled = enabledRaw !== "false" && enabledRaw !== "0";

  const supabaseUrl = get("SUPABASE_URL");
  const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" };
  }

  if (!gatewaySecret || !watchdogAgentId || !paperclipUrl || !paperclipKey) {
    return { error: "Missing gateway, watchdog, or Paperclip configuration" };
  }

  const rateLimitPerMinute = Math.max(
    1,
    Number.parseInt(get("RECOVERY_RATE_LIMIT_PER_MINUTE_GLOBAL") ?? "30", 10) || 30,
  );
  const loopWindowSec = Math.max(
    60,
    Number.parseInt(get("RECOVERY_LOOP_WINDOW_SEC") ?? "300", 10) || 300,
  );
  const loopMaxPerWindow = Math.max(
    1,
    Number.parseInt(get("RECOVERY_LOOP_MAX_PER_WINDOW") ?? "3", 10) || 3,
  );

  const supabase = createClient(supabaseUrl, serviceKey);

  return {
    supabase,
    fetch: globalThis.fetch,
    now: () => Date.now(),
    featureEnabled,
    gatewaySecret,
    watchdogAgentId,
    paperclipUrl,
    paperclipKey,
    targetAllowlist: parseAllowlist(get("RECOVERY_TARGET_AGENT_IDS")),
    rateLimitPerMinute,
    loopMaxPerWindow,
    loopWindowSec,
  };
}

async function paperclipPost(
  deps: RecoveryDeps,
  agentId: string,
  subpath: "resume" | "heartbeat/invoke",
  paperclipRunId?: string,
): Promise<Response> {
  const url = `${deps.paperclipUrl}/api/agents/${agentId}/${subpath}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${deps.paperclipKey}`,
    "Content-Type": "application/json",
  };
  if (paperclipRunId && isUuid(paperclipRunId)) {
    headers["X-Paperclip-Run-Id"] = paperclipRunId;
  }
  return deps.fetch(url, { method: "POST", headers, body: "{}" });
}

async function extractRunId(res: Response): Promise<string | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    const j = JSON.parse(text) as Record<string, unknown>;
    const id = j.runId ?? j.id ?? j.run_id;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

export type AuditRow = {
  id: string;
  requested_by_agent_id: string;
  target_agent_id: string;
  action: string;
  reason: string | null;
  idempotency_key: string;
  decision: "allowed" | "denied";
  decision_reason: string | null;
  invoked_run_id: string | null;
  paperclip_resume_status: number | null;
  paperclip_invoke_status: number | null;
  request_metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
};

function rowToGetResponse(r: AuditRow) {
  return {
    id: r.id,
    requestedByAgentId: r.requested_by_agent_id,
    targetAgentId: r.target_agent_id,
    action: r.action,
    reason: r.reason,
    idempotencyKey: r.idempotency_key,
    decision: r.decision,
    decisionReason: r.decision_reason,
    invokedRunId: r.invoked_run_id,
    paperclipResumeStatus: r.paperclip_resume_status,
    paperclipInvokeStatus: r.paperclip_invoke_status,
    requestMetadata: r.request_metadata,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  };
}

async function insertAudit(
  deps: RecoveryDeps,
  row: {
    requested_by_agent_id: string;
    target_agent_id: string;
    action: string;
    reason: string | null;
    idempotency_key: string;
    decision: "allowed" | "denied";
    decision_reason: string | null;
    invoked_run_id: string | null;
    paperclip_resume_status: number | null;
    paperclip_invoke_status: number | null;
    request_metadata: Record<string, unknown>;
    completed_at: string | null;
  },
): Promise<AuditRow | null> {
  const ins = await deps.supabase
    .from("automation_recovery_actions")
    .insert({
      requested_by_agent_id: row.requested_by_agent_id,
      target_agent_id: row.target_agent_id,
      action: row.action,
      reason: row.reason,
      idempotency_key: row.idempotency_key,
      decision: row.decision,
      decision_reason: row.decision_reason,
      invoked_run_id: row.invoked_run_id,
      paperclip_resume_status: row.paperclip_resume_status,
      paperclip_invoke_status: row.paperclip_invoke_status,
      request_metadata: row.request_metadata,
      completed_at: row.completed_at,
    })
    .select()
    .single();

  if (ins.error) {
    const code = (ins.error as { code?: string }).code;
    if (code === "23505") {
      const dup = await deps.supabase
        .from("automation_recovery_actions")
        .select("*")
        .eq("idempotency_key", row.idempotency_key)
        .maybeSingle();
      if (dup.data) return dup.data as AuditRow;
    }
    console.error("automation_recovery_actions insert", ins.error.message);
    return null;
  }
  return ins.data as AuditRow;
}

export async function handleAutomationRecovery(
  req: Request,
  deps: RecoveryDeps,
): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!deps.featureEnabled) {
    return jsonResponse({ error: "Recovery gateway disabled" }, 503);
  }

  const token = bearerToken(req.headers.get("Authorization"));
  if (!token || token !== deps.gatewaySecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id || !isUuid(id)) {
      return jsonResponse({ error: "Query id must be a UUID" }, 400);
    }
    const { data, error } = await deps.supabase
      .from("automation_recovery_actions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }
    if (!data) {
      return jsonResponse({ error: "Not found" }, 404);
    }
    return jsonResponse(rowToGetResponse(data as AuditRow));
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const requestedBy = body.requestedByAgentId?.trim() ?? "";
  const target = body.targetAgentId?.trim() ?? "";
  const idem = body.idempotencyKey?.trim() ?? "";
  const reason = body.reason?.trim().slice(0, 2000) ?? null;
  const actionRaw = body.action ?? "";
  const actionNorm = actionRaw ? normalizeAction(actionRaw) : "";
  const paperclipRunId = body.paperclipRunId?.trim();

  const meta: Record<string, unknown> = {
    userAgent: req.headers.get("user-agent") ?? null,
    paperclipRunId: paperclipRunId && isUuid(paperclipRunId) ? paperclipRunId : null,
  };

  if (!isUuid(requestedBy) || !isUuid(target) || !isUuid(idem)) {
    return jsonResponse(
      {
        error: "requestedByAgentId, targetAgentId, and idempotencyKey must be UUIDs",
      },
      400,
    );
  }

  const deny = async (
    decisionReason: string,
    httpStatus: number,
    extra: {
      paperclip_resume_status?: number | null;
      paperclip_invoke_status?: number | null;
      invoked_run_id?: string | null;
    } = {},
  ): Promise<Response> => {
    const row = await insertAudit(deps, {
      requested_by_agent_id: requestedBy,
      target_agent_id: target,
      action: actionNorm || "unknown",
      reason,
      idempotency_key: idem,
      decision: "denied",
      decision_reason: decisionReason,
      invoked_run_id: extra.invoked_run_id ?? null,
      paperclip_resume_status: extra.paperclip_resume_status ?? null,
      paperclip_invoke_status: extra.paperclip_invoke_status ?? null,
      request_metadata: meta,
      completed_at: new Date(deps.now()).toISOString(),
    });
    return jsonResponse(
      {
        id: row?.id,
        status: "denied" as const,
        decisionReason,
        targetAgentId: target,
        action: actionNorm || null,
      },
      httpStatus,
    );
  };

  if (requestedBy !== deps.watchdogAgentId) {
    return deny("requester_not_watchdog", 403);
  }

  if (deps.targetAllowlist.size === 0) {
    return deny("target_allowlist_empty", 503);
  }

  if (!deps.targetAllowlist.has(target)) {
    return deny("target_not_allowlisted", 403);
  }

  if (!actionNorm || !ALLOWED_ACTIONS.has(actionNorm)) {
    return deny("action_not_allowlisted", 400);
  }

  const { data: existing } = await deps.supabase
    .from("automation_recovery_actions")
    .select("*")
    .eq("idempotency_key", idem)
    .maybeSingle();

  if (existing) {
    const r = existing as AuditRow;
    const st = r.decision === "allowed" ? "accepted" : "denied";
    return jsonResponse(
      {
        id: r.id,
        status: st,
        targetAgentId: r.target_agent_id,
        action: r.action,
        decisionReason: r.decision_reason,
      },
      r.decision === "allowed" ? 200 : 403,
    );
  }

  const since = new Date(deps.now() - 60_000).toISOString();
  const { count: recentGlobal } = await deps.supabase
    .from("automation_recovery_actions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  if ((recentGlobal ?? 0) >= deps.rateLimitPerMinute) {
    return deny("rate_limit_global", 429);
  }

  const loopSince = new Date(deps.now() - deps.loopWindowSec * 1000).toISOString();
  const { count: loopCount } = await deps.supabase
    .from("automation_recovery_actions")
    .select("*", { count: "exact", head: true })
    .eq("target_agent_id", target)
    .eq("action", actionNorm)
    .eq("decision", "allowed")
    .gte("created_at", loopSince);

  if ((loopCount ?? 0) >= deps.loopMaxPerWindow) {
    return deny("loop_protection", 429);
  }

  let resumeStatus: number | null = null;
  let invokeStatus: number | null = null;
  let invokedRunId: string | null = null;

  if (actionNorm === "resume" || actionNorm === "resume_and_invoke") {
    const res = await paperclipPost(deps, target, "resume", paperclipRunId);
    resumeStatus = res.status;
    if (!res.ok) {
      return deny(`paperclip_resume_failed:${res.status}`, 502, {
        paperclip_resume_status: resumeStatus,
      });
    }
  }

  if (actionNorm === "heartbeat_invoke" || actionNorm === "resume_and_invoke") {
    const res = await paperclipPost(deps, target, "heartbeat/invoke", paperclipRunId);
    invokeStatus = res.status;
    invokedRunId = await extractRunId(res);
    if (!res.ok) {
      return deny(`paperclip_invoke_failed:${res.status}`, 502, {
        paperclip_resume_status: resumeStatus,
        paperclip_invoke_status: invokeStatus,
        invoked_run_id: invokedRunId,
      });
    }
  }

  const completedAt = new Date(deps.now()).toISOString();
  const row = await insertAudit(deps, {
    requested_by_agent_id: requestedBy,
    target_agent_id: target,
    action: actionNorm,
    reason,
    idempotency_key: idem,
    decision: "allowed",
    decision_reason: null,
    invoked_run_id: invokedRunId,
    paperclip_resume_status: resumeStatus,
    paperclip_invoke_status: invokeStatus,
    request_metadata: meta,
    completed_at: completedAt,
  });

  if (!row) {
    return jsonResponse({ error: "Audit persist failed" }, 500);
  }

  return jsonResponse({
    id: row.id,
    status: "accepted",
    targetAgentId: target,
    action: actionNorm,
  });
}
