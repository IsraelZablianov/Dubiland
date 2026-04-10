import { assertEquals } from "jsr:@std/assert";
import {
  handleAutomationRecovery,
  normalizeAction,
  parseAllowlist,
  type RecoveryDeps,
} from "./handler.ts";

const WD = "57030338-c341-45ee-ad6b-60a28cc9852b";
const T1 = "5f7a9323-368f-439d-b3a8-62cda910830b";
const IDEM1 = "aaaaaaaa-bbbb-4ccc-8111-111111111111";
const IDEM2 = "aaaaaaaa-bbbb-4ccc-8222-222222222222";
const IDEM3 = "aaaaaaaa-bbbb-4ccc-8333-333333333333";

function thenable<T>(value: T) {
  const p = Promise.resolve(value);
  const chain: Record<string, unknown> = {
    eq: () => chain,
    gte: () => chain,
    then: p.then.bind(p),
    catch: p.catch.bind(p),
    finally: p.finally.bind(p),
    [Symbol.toStringTag]: "Promise",
  };
  return chain as typeof chain & Promise<T>;
}

function createMockAudit() {
  const audit: Record<string, unknown>[] = [];
  return {
    audit,
    supabase: {
      from(_table: string) {
        return {
          select(
            _cols?: unknown,
            opts?: { count?: "exact"; head?: boolean },
          ) {
            if (opts?.head && opts?.count === "exact") {
              return thenable({ count: 0, data: null, error: null });
            }
            return {
              eq(_c: string, _v: string) {
                return this;
              },
              gte(_c: string, _v: string) {
                return this;
              },
              async maybeSingle() {
                return { data: null, error: null };
              },
            };
          },
          insert(row: Record<string, unknown>) {
            audit.push(row);
            return {
              select() {
                return {
                  async single() {
                    return {
                      data: {
                        ...row,
                        id: "new-row-id",
                        created_at: new Date().toISOString(),
                      },
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      },
    },
  };
}

function depsAuthz(overrides: Partial<RecoveryDeps> = {}): RecoveryDeps {
  const { supabase } = createMockAudit();
  const base: RecoveryDeps = {
    supabase: supabase as unknown as RecoveryDeps["supabase"],
    fetch: () => Promise.resolve(new Response("{}", { status: 200 })),
    now: () => 1_700_000_000_000,
    featureEnabled: true,
    gatewaySecret: "gw-secret",
    watchdogAgentId: WD,
    paperclipUrl: "http://pc.test",
    paperclipKey: "pc-key",
    targetAllowlist: new Set([T1]),
    rateLimitPerMinute: 100,
    loopWindowSec: 300,
    loopMaxPerWindow: 10,
    ...overrides,
  };
  return base;
}

Deno.test("normalizeAction maps heartbeat/invoke", () => {
  assertEquals(normalizeAction("heartbeat/invoke"), "heartbeat_invoke");
  assertEquals(normalizeAction("RESUME"), "resume");
});

Deno.test("parseAllowlist keeps valid UUIDs only", () => {
  const s = parseAllowlist(`${T1}, not-a-uuid, `);
  assertEquals(s.size, 1);
  assertEquals(s.has(T1), true);
});

Deno.test("POST 401 without bearer secret", async () => {
  const res = await handleAutomationRecovery(
    new Request("http://x/", { method: "POST", body: "{}" }),
    depsAuthz(),
  );
  assertEquals(res.status, 401);
});

Deno.test("POST 401 wrong secret", async () => {
  const res = await handleAutomationRecovery(
    new Request("http://x/", {
      method: "POST",
      headers: { Authorization: "Bearer wrong" },
      body: JSON.stringify({
        requestedByAgentId: WD,
        targetAgentId: T1,
        action: "resume",
        idempotencyKey: IDEM1,
      }),
    }),
    depsAuthz(),
  );
  assertEquals(res.status, 401);
});

Deno.test("POST 403 when requester is not watchdog", async () => {
  const other = "11111111-2222-4333-8444-555555555555";
  const res = await handleAutomationRecovery(
    new Request("http://x/", {
      method: "POST",
      headers: { Authorization: "Bearer gw-secret" },
      body: JSON.stringify({
        requestedByAgentId: other,
        targetAgentId: T1,
        action: "resume",
        idempotencyKey: IDEM1,
      }),
    }),
    depsAuthz(),
  );
  assertEquals(res.status, 403);
  const j = await res.json() as { decisionReason?: string };
  assertEquals(j.decisionReason, "requester_not_watchdog");
});

Deno.test("POST 403 target not allowlisted", async () => {
  const res = await handleAutomationRecovery(
    new Request("http://x/", {
      method: "POST",
      headers: { Authorization: "Bearer gw-secret" },
      body: JSON.stringify({
        requestedByAgentId: WD,
        targetAgentId: "99999999-9999-4999-8999-999999999999",
        action: "resume",
        idempotencyKey: IDEM2,
      }),
    }),
    depsAuthz(),
  );
  assertEquals(res.status, 403);
  const j = await res.json() as { decisionReason?: string };
  assertEquals(j.decisionReason, "target_not_allowlisted");
});

Deno.test("POST 503 empty allowlist", async () => {
  const res = await handleAutomationRecovery(
    new Request("http://x/", {
      method: "POST",
      headers: { Authorization: "Bearer gw-secret" },
      body: JSON.stringify({
        requestedByAgentId: WD,
        targetAgentId: T1,
        action: "resume",
        idempotencyKey: IDEM3,
      }),
    }),
    depsAuthz({ targetAllowlist: new Set() }),
  );
  assertEquals(res.status, 503);
});

Deno.test("GET 401 without auth", async () => {
  const res = await handleAutomationRecovery(
    new Request("http://x/?id=aaaaaaaa-bbbb-4ccc-8eee-eeeeeeeeeeee"),
    depsAuthz(),
  );
  assertEquals(res.status, 401);
});
