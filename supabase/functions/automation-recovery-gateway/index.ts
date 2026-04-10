import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleAutomationRecovery, loadRecoveryDeps } from "./handler.ts";

Deno.serve(async (req: Request) => {
  const loaded = loadRecoveryDeps((k) => Deno.env.get(k));
  if ("error" in loaded) {
    return new Response(JSON.stringify({ error: loaded.error }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  return handleAutomationRecovery(req, loaded);
});
